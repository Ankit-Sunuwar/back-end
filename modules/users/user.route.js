const router = require("express").Router();
const multer = require("multer"); // multer le body obj thapdinxa, req ma file/files bhanni obj thapdinxa.
const Controller = require("./user.controller");
const { validate } = require("./user.validation");

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

module.exports = router;
