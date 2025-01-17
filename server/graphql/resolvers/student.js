const isEmpty = require('lodash/isEmpty');
const { UserInputError } = require('apollo-server-express');
const Student = require('../../db/Student');
const Level = require('../../db/Level');
const Department = require('../../db/Department');
const uploadFile = require('../../utils/uploadFile');
const cleanObj = require('../../utils/cleanObj');

module.exports = {
  Student: {
    async level(parent) {
      return Level.findById(parent.levelId);
    },
    async department(parent) {
      return Department.findById(parent.departmentId);
    },
  },
  Query: {
    async getStudents(_, args) {
      return Student.find({
        ...cleanObj(args),
        deleted: false,
      });
    },
    async getStudent(_, { id, serialNumber }) {
      if (id) {
        return Student.findById(id);
      }
      if (serialNumber) {
        return Student.findOne({ serialNumber });
      }
      throw new UserInputError('Either id or serialnumber must be provided');
    },
  },
  Mutation: {
    async addStudent(_, {
      name, gender, levelId, departmentId, address, dob, photo, validUpto, serialNumber,
      contactNumber,
    }) {
      let photoId;
      if (photo) {
        const { id } = await uploadFile(photo);
        photoId = id;
      }
      const newStudent = new Student({
        name,
        gender,
        deleted: false,
        levelId,
        departmentId,
        serialNumber,
        address,
        contactNumber,
        dob,
        photo: photoId,
        validUpto,
      });
      const res = await newStudent.save();

      return {
        id: res._id,
        ...res._doc,
      };
    },
    async updateStudent(_, { id, photo, ...args }) {
      let photoId;
      if (photo) {
        const { id: pid } = await uploadFile(photo);
        photoId = pid;
      }
      const updates = {
        ...args,
        photo: photoId,
      };
      const res = await Student.findByIdAndUpdate(id, cleanObj(updates), { new: true });
      return {
        id: res._id,
        ...res._doc,
      };
    },
    async deleteStudent(_, { id }) {
      await Student.findByIdAndUpdate(id, {
        deleted: true,
      }, { new: true });
      return true;
    },
    async deleteStudents(_, args) {
      const filter = cleanObj(args);
      if (isEmpty(filter)) {
        throw new UserInputError('No arguments provided');
      }
      await Student.updateMany({ ...filter }, {
        deleted: true,
      });
      return true;
    },
  },
};
