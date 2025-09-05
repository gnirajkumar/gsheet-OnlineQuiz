import json
import pandas as pd

# Load your quiz-data.json
with open("quiz-data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

rows = []

# Traverse nested JSON
for cls, subjects in data.items():
    for subj, topics in subjects.items():
        for topic, questions in topics.items():
            for q in questions:
                row = {
                    "Class": cls,
                    "Subject": subj,
                    "Topic": topic,
                    "QuestionText": q.get("questionText", ""),
                    "QuestionImage": q.get("questionImage", ""),
                    "Option1": q["options"][0]["text"],
                    "Opt1Img": q["options"][0]["image"],
                    "Option2": q["options"][1]["text"],
                    "Opt2Img": q["options"][1]["image"],
                    "Option3": q["options"][2]["text"],
                    "Opt3Img": q["options"][2]["image"],
                    "Option4": q["options"][3]["text"],
                    "Opt4Img": q["options"][3]["image"],
                    "Correct": q.get("correctIndex"),
                    "ExplanationText": q.get("explanationText", ""),
                    "ExplanationImage": q.get("explanationImage", "")
                }
                rows.append(row)

# Save to CSV
df = pd.DataFrame(rows)
df.to_csv("quiz-data.csv", index=False)
print("✅ Exported quiz-data.csv")
