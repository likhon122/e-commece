import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IPendingUserDoc extends Document {
  email: string;
  password: string;
  name: string;
  verificationToken: string;
  verificationExpiry: Date;
  createdAt: Date;
}

const PendingUserSchema = new Schema<IPendingUserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    verificationToken: {
      type: String,
      required: true,
    },
    verificationExpiry: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
PendingUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Auto-delete expired records (TTL index)
PendingUserSchema.index({ verificationExpiry: 1 }, { expireAfterSeconds: 0 });

const PendingUser: Model<IPendingUserDoc> =
  mongoose.models.PendingUser ||
  mongoose.model<IPendingUserDoc>("PendingUser", PendingUserSchema);

export default PendingUser;
