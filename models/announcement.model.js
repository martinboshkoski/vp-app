const mongodb = require("mongodb");
const moment = require("moment");
const database = require("../data/database");
const db = require("../data/database");

class Announcement {
  constructor(note, attorney, announcementEntryDate, year, month) {
    this.note = note;
    this.attorney = attorney;
    this.announcementEntryDate = announcementEntryDate; // Fixed typo
    this.year = year;
    this.month = month;
  }
  
  async save() {
    // Check if note is not null before saving
    if (this.note !== null) {
        const announcementData = {
            note: this.note,
            attorney: this.attorney,
            announcementEntryDate: this.announcementEntryDate,
            year: this.year,
            month: this.month,
        };

        const collection = database.getDb().collection("announcements");
        if (this.id) {
            const announcementId = new mongodb.ObjectId(this.id);
            await collection.updateOne({ _id: announcementId }, { $set: announcementData });
        } else {
            await collection.insertOne(announcementData);
        }
    }
}
  ///////////////////////////////////////////////////////////////
  static async findAllAnnouncement() { // Added parentheses
    const announcements = await db.getDb().collection("announcements").find().toArray(); // Fixed typos
    return announcements.map(function (announcementDocument) {
      return new Announcement(announcementDocument.note, announcementDocument.attorney, announcementDocument.announcementEntryDate, announcementDocument.year, announcementDocument.month); // Adjusted properties
    });
  }     

///////////////////////////////////////////////////////////////
  static async deleteByNote(note) {
    try {
      await db.getDb().collection('announcements').deleteOne({ note: note });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Announcement;
