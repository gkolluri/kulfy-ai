import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  handle: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  handle: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;


