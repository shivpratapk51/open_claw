import express, { application } from "express";
import { run } from "./model.js";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());
app.post("/message", async (req, res) => {
  const { message } = req.body;
  // console.log(message);
  const history = await run(message);
  return res.json({
    messages: history,
  });
});

app.listen(PORT, () => {
  console.log(`Sereve is running on port ${PORT}.`);
});
