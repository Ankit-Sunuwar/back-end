const Model = require("./user.model");
const { genHash } = require("../../utilis/secure");
const { genOTP } = require("../../utilis/token");

const create = (payload) => {};

const register = async (payload) => {
  const { password, roles, isActice, ...rest } = payload;
  const userExist = await Model.findOne({ email: rest?.email }); // email xa ki xaina bhanye ra check garye ko.
  if (userExist) throw new Error("This email has already taken");
  rest.password = genHash(password); // yes ma password hash hunxa.

  const newUser = await Model.create(rest); // eha naya user create hunxa.
  if (!newUser) throw new Error(" User registration failed, Try again later. ");

  const myToken = genOTP();
  await Model.updateOne({ email: newUser.email }, { token: myToken });
  // send email.
  return { data: null, msg: "Please check your email for verification" };
};

const login = (payload) => {};
const genEmailToken = () => {};
const verifyEmailToken = () => {};
const genForgetPasswordToken = () => {};
const verifyForgetPasswordToken = () => {};
const changePassword = () => {};
const resetPassword = () => {};
const blockedUser = () => {};
const list = () => {};
const getById = () => {};
const updateProfile = () => {};

module.exports = {
  create,
  register,
  login,
  genEmailToken,
  verifyEmailToken,
  genForgetPasswordToken,
  verifyForgetPasswordToken,
  changePassword,
  resetPassword,
  blockedUser,
  list,
  getById,
  updateProfile,
};
