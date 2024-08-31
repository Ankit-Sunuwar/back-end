const router = require("express").Router();
const multer = require("multer"); // multer le body obj thapdinxa, req ma file/files bhanni obj thapdinxa.
const Controller = require("./user.controller");
const { secureAPI } = require("../../utilis/secure");
const { validate, forgetPasswordValidation } = require("./user.validation");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "." + file?.originalname.split(".")[1]);
  },
});

const upload = multer({ storage }); // multer(opts)

router.post("/login", validate, async (req, res, next) => {
  try {
    const result = await Controller.login(req.body);
    res.json({ data: result, msg: "User loggsed in sucessfully" });
  } catch (e) {
    next(e);
  }
});

router.post("/register", upload.single("image"), async (req, res, next) => {
  try {
    if (req.file) {
      req.body.image = req.file.filename; // yatti bata base ma rakh dinxu bhanye ko ho.
    }
    const result = await Controller.register(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/verify-email", async (req, res, next) => {
  try {
    const result = await Controller.verifyEmailToken(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/generate-fp-token", async (req, res, next) => {
  try {
    const result = await Controller.genForgetPasswordToken(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/verify-fp-token",
  forgetPasswordValidation,
  async (req, res, next) => {
    try {
      const result = await Controller.verifyForgetPasswordToken(req.body);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  "/change-password",
  secureAPI(["admin", "user"]),
  async (req, res, next) => {
    try {
      const result = await Controller.changePassword(req.body);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

router.put("/reset-password", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await Controller.resetPassword(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.patch("/block", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await Controller.blockUser(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await Controller.create(req.body);
    res.json({ data: result, msg: "User Created Sucessfully" });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await Controller.getById(req?.params?.id);
    res.json({ data: result, msg: "User Detail Generated Sucessfully" });
  } catch (e) {
    next(e);
  }
});

router.put("/profile", secureAPI(["admin", "user"]), async (req, res, next) => {
  try {
    const result = await Controller.updateProfile(req.body);
    res.json({ data: result, msg: "User Data Updated Sucessfully" });
  } catch (e) {
    next(e);
  }
}); // yo tala ko id dynamic hunxa ani yadi mathi bhayo bhani id bhetra xirxa ani run hudai na, tessaile mathi rakhnu par xa

router.put("/:id", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await Controller.updateById({
      id: req?.params?.id,
      payload: req.body,
    });
    res.json({ data: result, msg: "User Data Updated Sucessfully" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
