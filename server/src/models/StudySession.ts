import { Schema, model, Document, Types } from "mongoose";

export interface IStudySession extends Document {
  userId: Types.ObjectId;
  deckId: Types.ObjectId;
  startTime: Date;
  endTime: Date | null;
  clientDuration: number;
  calculatedDuration: number;
  totalAttempts: number;
  correctAttempts: number;
  status: "active" | "completed" | "abandoned";
  createdAt: Date;
  updatedAt: Date;
  sessionAccuracy: number;
  deckTitle?: string;
  updateAttempts(correct: boolean): Promise<void>;
}

const studySessionSchema = new Schema<IStudySession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      index: true,
    },
    deckId: {
      type: Schema.Types.ObjectId,
      ref: "CardDeck",
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    clientDuration: {
      type: Number,
      required: true,
      default: 0,
    },
    calculatedDuration: {
      type: Number,
      default: 0,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
    correctAttempts: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual for accuracy percentage with additional type safety
studySessionSchema.virtual("sessionAccuracy").get(function (): number {
  if (!this.totalAttempts || this.totalAttempts === 0) return 0;
  const accuracy = (this.correctAttempts / this.totalAttempts) * 100;
  return Math.round(accuracy);
});

// Virtual for deck title
studySessionSchema
  .virtual("deckTitle", {
    ref: "CardDeck",
    localField: "deckId",
    foreignField: "_id",
    justOne: true,
    options: { select: "name" },
  })
  .get(function (deck: any) {
    // Extract just the name from the populated deck object
    return deck ? deck.name : null;
  });

// Add middleware to update attempt counts
studySessionSchema.methods.updateAttempts = async function (correct: boolean) {
  this.totalAttempts += 1;
  if (correct) {
    this.correctAttempts += 1;
  }
  await this.save();
};

// Pre-save middleware to validate duration
studySessionSchema.pre("save", function (next) {
  if (this.endTime && this.startTime) {
    const serverDuration = Math.floor(
      (this.endTime.getTime() - this.startTime.getTime()) / 1000
    );
    // Allow for small discrepancy between client and server duration
    const discrepancy = Math.abs(serverDuration - this.clientDuration);
    if (discrepancy > 300) {
      // 5 minute tolerance
      console.warn(
        `Large duration discrepancy detected for session ${this._id}`
      );
    }
    this.calculatedDuration = serverDuration;
  }
  next();
});

const StudySession = model<IStudySession>("StudySession", studySessionSchema);
export default StudySession;
