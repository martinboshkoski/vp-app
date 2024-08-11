const Agent = require("../models/agent.model");
const Announcement = require('../models/announcement.model'); 

const ejs = require('ejs');

const mongodb = require("mongodb");
const moment = require("moment");
const db = require("../data/database");
const { ObjectID } = require("bson");


async function newAnnouncement(req, res, next) {
  let attorney = await Agent.getAgentWithSameId(req.session.uid);

  // Check if note is provided before creating a new Announcement
  if (req.body.note) {
      const announcementData = {
          note: req.body.note,
          attorney: attorney.name,
          announcementEntryDate: moment().format("DD/MM/YYYY"),
          month: moment().format("MMMM"),
          year: moment().format("YYYY")
          // team: team,
      };

      const newAnnouncement = new Announcement(
          announcementData.note,
          announcementData.attorney,
          announcementData.announcementEntryDate,
          announcementData.month,
          announcementData.year,
          // announcementData.team
      );
      await newAnnouncement.save();
  }

  try {
  res.redirect('/');
} catch (error) {
  next(error); // Handle any errors appropriately
}
}


async function deleteAnnouncement(req, res, next) {
  const announcementNote = req.body.note;
  try {
    await Announcement.deleteByNote(announcementNote);
    res.redirect('/'); // Redirect to the homepage or any other desired page
  } catch (error) {
    next(error);
  }
}

module.exports = {
    newAnnouncement: newAnnouncement, 
    deleteAnnouncement:deleteAnnouncement
};
