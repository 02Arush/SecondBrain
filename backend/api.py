from flask import Flask, request

app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello, World!"


# params
# task_name: string
# task_description: string
# returns {"task_name" : string, "task_description" : string}
@app.post("/task_to_subtasks")
def task_to_subtasks():
    task_name:str = request.form['task_name']
    task_description:str = request.form['task_description']
    return {
        "task_name": task_name,
        "task_description": task_description
    }
   
