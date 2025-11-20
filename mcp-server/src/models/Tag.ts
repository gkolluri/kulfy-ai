import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ITag extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
}

const TagSchema = new Schema<ITag>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 50,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Tag: Model<ITag> = mongoose.models.Tag || mongoose.model<ITag>('Tag', TagSchema);

export default Tag;


