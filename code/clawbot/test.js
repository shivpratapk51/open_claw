import Groq from "groq-sdk";
import 'dotenv/config'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getModels = async () => {
  return await groq.models.list();
};

getModels().then((models) => {
  console.log(models);
});