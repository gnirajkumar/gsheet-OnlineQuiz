import json
import pandas as pd

# Load your quiz-data.json
try:
    with open("quiz-data.json", "r", encoding="utf-8") as f:
        data = json.load(f)
except FileNotFoundError:
    print("Error: 'quiz-data.json' not found. Make sure the file is in the same directory.")
    exit()
except json.JSONDecodeError:
    print("Error: 'quiz-data.json' contains invalid JSON.")
    exit()

rows = []

# Traverse nested JSON
for cls, subjects in data.items():
    for subj, topics in subjects.items():
        for topic, questions in topics.items():
            for q in questions:
                # Retrieve the value of "correct" and subtract 1 if it's a valid number.
                # If "correct" is not found or is not a number, it defaults to an empty string.
                correct_index = q.get("correct")
                if isinstance(correct_index, int):
                    correct_index = correct_index 
                else:
                    correct_index = ""

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
                    "Correct": correct_index, # The corrected and updated value
                    "ExplanationText": q.get("explanationText", ""),
                    "ExplanationImage": q.get("explanationImage", "")
                }
                rows.append(row)

# Save to CSV
df = pd.DataFrame(rows)
df.to_csv("quiz-data.csv", index=False)
print("✅ Exported quiz-data.csv")
