import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const imageMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const videoMimeTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
  "video/3gpp",
]);
const videoExtensions = new Set([".mp4", ".webm", ".ogg", ".mov", ".m4v", ".3gp"]);
const maxImageBytes = 5 * 1024 * 1024;
const maxVideoBytes = 50 * 1024 * 1024;

function sanitizeBaseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.-]/g, "-").replace(/-+/g, "-");
}

export async function POST(request: NextRequest) {
  try {
    if (!(await hasAdminAccess(request))) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const kind = `${formData.get("kind") || "image"}`;

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "File is required" }, { status: 400 });
    }

    if (!["image", "video"].includes(kind)) {
      return NextResponse.json({ success: false, error: "Invalid upload kind" }, { status: 400 });
    }

    const isImage = kind === "image";
    const allowedTypes = isImage ? imageMimeTypes : videoMimeTypes;
    const maxBytes = isImage ? maxImageBytes : maxVideoBytes;
    const fileExt = path.extname(file.name).toLowerCase();

    const isAllowedByMime = allowedTypes.has(file.type);
    const isAllowedByExtension = !isImage && videoExtensions.has(fileExt);

    if (!isAllowedByMime && !isAllowedByExtension) {
      return NextResponse.json(
        {
          success: false,
          error: isImage
            ? "Only JPG, PNG, and WEBP images are allowed"
            : "Only MP4, WEBM, OGG, MOV, M4V, and 3GP videos are allowed",
        },
        { status: 400 },
      );
    }

    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          success: false,
          error: isImage ? "Image must be 5MB or less" : "Video must be 50MB or less",
        },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products", kind);
    await mkdir(uploadDir, { recursive: true });

    const ext = fileExt || (isImage ? ".jpg" : ".mp4");
    const safeName = sanitizeBaseName(path.basename(file.name, ext));
    const fileName = `${Date.now()}-${randomUUID()}-${safeName}${ext}`;
    const absolutePath = path.join(uploadDir, fileName);

    await writeFile(absolutePath, buffer);

    const publicUrl = `/uploads/products/${kind}/${fileName}`;

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        mimeType: file.type,
        size: file.size,
        kind,
      },
    });
  } catch (error) {
    console.error("Admin upload error:", error);
    return NextResponse.json({ success: false, error: "Failed to upload media" }, { status: 500 });
  }
}
