
from transformers import T5Tokenizer, T5ForConditionalGeneration, pipeline
from huggingface_hub import login

tokenizer = T5Tokenizer.from_pretrained("google/flan-t5-small")
model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-small")

input_text = "translate English to German: How old are you?"
input_ids = tokenizer(input_text, return_tensors="pt").input_ids

outputs = model.generate(input_ids)
print(tokenizer.decode(outputs[0]))

# Use a pipeline as a high-level helper


# response = pipeline("text-generation", model="google/gemma-2-2b")
# response = pipe("What color is the sky?")
login(token="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")
pipe = pipeline(
    "text-generation",
    model="google/gemma-2-2b",
    device="auto",  # replace with "mps" to run on a Mac device
)

text = "Once upon a time,"
outputs = pipe(text, max_new_tokens=256)
response = outputs[0]["generated_text"]
print(response)
