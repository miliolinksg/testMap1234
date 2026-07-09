const express = require("express");
const cors = require("cors");
const storesRouter = require("./routes/stores");

const app = express();
const PORT = 3001;

app.use(cors());

app.use("/stores", storesRouter);

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
