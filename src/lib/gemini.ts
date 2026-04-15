import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function fileToGenerativePart(file: File): Promise<{
  inlineData: { data: string; mimeType: string };
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Function 1: Calorie Counting
export async function analyzeFoodJSON(textDesc: string, imageFile?: File) {
  if (!apiKey) throw new Error("Gemini API key is missing");
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          calories: { type: SchemaType.INTEGER, description: "Estimated total calories" },
          protein: { type: SchemaType.INTEGER, description: "Estimated protein in grams" },
          carbs: { type: SchemaType.INTEGER, description: "Estimated carbs in grams" },
          fat: { type: SchemaType.INTEGER, description: "Estimated fat in grams" },
        },
        required: ["calories", "protein", "carbs", "fat"]
      }
    }
  });

  const prompt = `Analyze this food description and/or photo: ${textDesc || "No description provided."}. Estimate the calories, protein, carbs, and fat realistically.`;
  const contents: any[] = [{ text: prompt }];
  if (imageFile) {
    contents.push(await fileToGenerativePart(imageFile));
  }

  const result = await model.generateContent(contents);
  return JSON.parse(result.response.text());
}

// Function 2: Body Scan & Goals
export async function analyzeBodyFatJSON(metrics: any, imageFile?: File) {
  if (!apiKey) throw new Error("Gemini API key is missing");
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          bodyFatPct: { type: SchemaType.INTEGER, description: "Estimated body fat percentage" },
          targetCalories: { type: SchemaType.INTEGER, description: "Daily calories goal based on metrics" },
          targetProtein: { type: SchemaType.INTEGER, description: "Daily protein goal" },
          targetCarbs: { type: SchemaType.INTEGER, description: "Daily carbs goal" },
          targetFat: { type: SchemaType.INTEGER, description: "Daily fat goal" },
        },
        required: ["bodyFatPct", "targetCalories", "targetProtein", "targetCarbs", "targetFat"]
      }
    }
  });

  const prompt = `User metrics: Height: ${metrics.height}cm, Weight: ${metrics.weight}kg, Ethnicity: ${metrics.ethnicity}. Analyze metrics and optional photo to estimate body fat percentage and calculate ideal daily macronutrient goals for cutting/recomp.`;
  const contents: any[] = [{ text: prompt }];
  if (imageFile) {
    contents.push(await fileToGenerativePart(imageFile));
  }

  const result = await model.generateContent(contents);
  return JSON.parse(result.response.text());
}

// Function 3: Exercise Tracker
export async function analyzeExerciseJSON(textDesc: string) {
  if (!apiKey) throw new Error("Gemini API key is missing");
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          caloriesBurned: { type: SchemaType.INTEGER, description: "Estimated calories burned" }
        },
        required: ["caloriesBurned"]
      }
    }
  });

  const prompt = `Estimate the total calories burned for this activity: ${textDesc}. Return just the realistic numerical estimation based on average body weight if unknown.`;
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

// Function 4: Generate Action Plan Timetable
export async function generateTimetableJSON(metrics: any, goals: any) {
  if (!apiKey) throw new Error("Gemini API key is missing");
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          tasks: { 
            type: SchemaType.ARRAY, 
            description: "List of actionable timetable tasks.",
            items: { type: SchemaType.STRING } 
          }
        },
        required: ["tasks"]
      }
    }
  });

  const prompt = `You are an elite fitness planner. 
User Metrics: Height: ${metrics.height}cm, Weight: ${metrics.weight}kg, Body Fat: ${metrics.bodyFatPct}%.
User Goals: Target Weight: ${goals.targetWeight}kg, Target Body Fat: ${goals.targetBodyFatPct}%, Calories: ${goals.calories}. 

Create a specific, daily actionable timetable (e.g., "7:00 AM: 20 min Fasted Cardio", "1:00 PM: Hit 40g Protein Window"). Return the actionable steps as a string array called 'tasks'. Limit to 5-7 core habits.`;
  
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
