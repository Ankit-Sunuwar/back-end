const Model = require("./user.model");
const { genHash, compareHash } = require("../../utilis/secure");
const { genOTP, genToken } = require("../../utilis/token");
const { sendEmail } = require("../../services/mailer");
const { model } = require("mongoose");

const register = async (payload) => {
  const { password, roles, isActice, ...rest } = payload;
  // Check if user email already exists or not
  const userExist = await Model.findOne({ email: rest?.email }); // email xa ki xaina bhanye ra check garye ko.
  if (userExist) throw new Error("This email has already taken");
  // hash the text password
  rest.password = genHash(password);
  // register the user into database
  const newUser = await Model.create(rest); // eha naya user create hunxa.
  if (!newUser) throw new Error(" User registration failed. Try again later. ");
  // generate the otp & update the user model with token
  const myToken = genOTP(); // token created.
  await Model.updateOne({ email: newUser.email }, { token: myToken });
  // send email.
  // send otp through email.
  const isEmailSent = await genEmailToken({
    to: newUser?.email,
    subject: "Welcome to XYZ hotel Mgmt",
    msg: `<h1>Your OTP code for verification is ${myToken}</h1>`,
  });
  if (!isEmailSent) throw new Error("User email sending failed...");
  return { data: null, msg: "Please check your email for verification" };
};

// mathi ko (register) ko " 17. const myToken = genOTP(); "le token gen garxa ani tala ko (genEmailToken) le user ko email ma send gar xa.
const genEmailToken = async ({ to, subject, msg }) => {
  const { messageId } = await sendEmail({ to, subject, htmlMessage: msg });
  return messageId ? true : false;
};

const verifyEmailToken = async (payload) => {
  const { email, token } = payload;
  // email system check garnu paryo + user shouldn't be blocked
  const user = await Model.findOne({ email, isBlocked: false });
  if (!user) throw new Error("User not found");
  // compare user le pathaye ko token with compare database
  const isValidToken = token === user?.token;
  if (!isValidToken) throw new Error("Invalid Token");
  // match bhayo bhani => email le search tes paxi, isActive : true & token empty.
  const updatedUser = await Model.updateOne(
    { email },
    { isActive: true, token: "" }
  );
  if (!updatedUser) throw new Error("Email verification is failed"); // TODO fix minor issue.
  return {
    data: null,
    msg: "Thank you for verifying your email for verification",
  };
};

const login = async (payload) => {
  const { email, password } = payload;
  // user find using email + blocked  + active check
  const user = await Model.findOne({ email, isActive: true, isBlocked: false });
  if (!user) throw new Error("User not found");
  // compare password with db stored pw
  const isValidPw = compareHash(password, user?.password);
  if (!isValidPw) throw new Error("Username or Password didn't match");
  // gentoken return that token
  const data = {
    name: user?.name,
    email: user?.email,
    roles: user?.roles,
  };
  return genToken(data);
};

// 1. Payload  => Email; Destructure
const genForgetPasswordToken = async ({ email }) => {
  // 2. Check email for user + (isBlocked, isActive?)
  const user = await Model.findOne({ email, isActive: true, isBlocked: false });
  if (!user) throw new Error("User not found");
  // 3. Gen new token
  const myToken = genOTP(); // token created.
  // 4. Send token to email for the password change
  await Model.updateOne({ email }, { token: myToken });
  // 5. Store token in database in user data
  const isEmailSent = await genEmailToken({
    to: user?.email,
    subject: "Forget password for XYZ Hotel-Management",
    msg: `<h1>Your Forget Password Token Is ${myToken}</h1>`,
  });
  if (!isEmailSent) throw new Error("User email sending failed...");
  return { data: null, msg: "Please check your email for token" };
};

const verifyForgetPasswordToken = async ({ email, token, newPassword }) => {
  // 1. check email for user
  const user = await Model.findOne({ email, isActive: true, isBlocked: false });
  if (!user) throw new Error("User not found");
  // 2. check token for user
  const isValidToken = token === user?.token;
  if (!isValidToken) throw new Error("Token mismatch");
  // 3. token match; newPassword hash
  const password = genHash(newPassword);
  // 4. update the user data with new password hash and empty token field
  const updatedUser = await Model.updateOne({ email }, { password, token: "" });
  if (!updatedUser) throw new Error("Forget Password Change failed"); // TODO fix minor issue
  return { data: null, msg: "Password Changed Successfully" };
};

const changePassword = async ({ email, oldPassword, newPassword }) => {
  // 1. find the user using email; isBlocked; isActive
  const user = await Model.findOne({ email, isActive: true, isBlocked: false });
  if (!user) throw new Error("User not found");
  // 2. compare the oldpw store in Db
  const isValiedPw = compareHash(oldPassword, user?.password);
  if (!isValiedPw) throw new Error("Password mismatch");
  // 3. generate hash of new password
  const password = genHash(newPassword);
  // 4. update the user data with newpw
  const updatedUser = await Model.findOneAndUpdate(
    { email },
    { password },
    { new: true } // ensure we get the update user document data
  );
  if (!updatedUser) throw new Error("Password Change Failed");
  return { data: null, msg: "Password Changed Sucessfully" };
};

const updateProfile = async (payload) => {
  const { updated_by: currentUser, ...rest } = payload;
  return await Model.findByIdAndUpdate({ _id: currentUser }, rest, {
    new: true,
  }).select("-password");
}; // Special update case using role middleware

// Admin Controllers
const resetPassword = async ({
  email,
  newPassword,
  updated_by,
  created_by,
}) => {
  //1. find the user using email; isBlocked; isActive
  const user = await Model.findOne({ email, isActive: true, isBlocked: false });
  if (!user) throw new Error("User not found");
  //3. generate hash of new password
  const password = genHash(newPassword);
  //4. update the user data with new password
  const updatedUser = await Model.findOneAndUpdate(
    { email },
    { password, updated_by, created_by },
    { new: true }
  );
  if (!updatedUser) throw new Error("Password Reset failed");
  return { data: null, msg: "Password Reset Successfully" };
};

const blockUser = async ({ email }) => {
  //1. find the user using email; isBlocked; isActive
  const user = await Model.findOne({ email, isActive: true });
  if (!user) throw new Error("User not found");
  //2. update the user data with new block status
  const updatedUser = await Model.findOneAndUpdate(
    { email },
    { isBlocked: !user?.isBlocked },
    { new: true }
  );
  if (!updatedUser) throw new Error("User Block failed");
  return {
    data: { isBlocked: updatedUser?.isBlocked },
    msg: `User ${
      updatedUser?.isBlocked ? "blocked" : "unblocked"
    } Successfully`,
  };
};

const create = async (payload) => {
  const { password, updated_by, ...rest } = payload;
  rest.isActive = true;
  rest.created_by = updated_by;
  rest.password = genHash(password);
  const user = await Model.create(rest);
  return Model.findOne({ email: user?.email }).select("-password");
};

const list = async ({ filter, search, page = 1, limit = 10 }) => {
  let currentPage = +page;
  currentPage = currentPage < 1 ? 1 : currentPage;
  // multiple filter (role, status)
  // const { isBlocked, isActive } = filter;

  // search
  const { name } = search;

  const query = [];

  if (name) {
    query.push({
      $match: {
        name: new RegExp(name, "gi"),
      },
    });
  }

  // pagination
  query.push(
    {
      $facet: {
        metadata: [
          {
            $count: "total",
          },
        ],
        data: [
          {
            $skip: (currentPage - 1) * +limit, // "+" garyo bhani jahile number ma hunxa. Same as, type conversion.
          },
          {
            $limit: +limit,
          },
        ],
      },
    },
    {
      $addFields: {
        total: {
          $arrayElemAt: ["$metadata.total", 0],
        },
      },
    },
    {
      $project: {
        metadata: 0,
      },
    }
  );

  const result = await Model.aggregate(query);
  return {
    data: result[0]?.data,
    page: +currentPage,
    limit: +limit,
    total: result[0].total || 0,
  };
}; // Advance DB Operations (Aggregation)

const getById = (_id) => {
  return Model.findOne({ _id }).select("-password");
};

const updateById = async ({ id, payload }) => {
  const user = await Model.findOne({ _id: id });
  if (!user) throw new Error("User not found");
  return await Model.findOneAndUpdate({ _id: id }, payload, {
    new: true, // naya data aaunxa ani return hunxa.
  }).select("-password");
};

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
  blockUser,
  list,
  getById,
  updateProfile,
  updateById,
};
