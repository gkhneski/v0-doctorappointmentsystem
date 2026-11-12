"""Eski NeoBreed kodundaki sabit yonerge metinlerini kaynak dosyalardan OKUR (calistirmadan).

Kullanim: python -I make_texts.py <nbreeda/backend> <cikti.json>
"""
import ast
import json
import sys

backend, out_path = sys.argv[1], sys.argv[2]


def parse(name):
    with open(f"{backend}/generation/{name}.py", encoding="utf-8") as fh:
        return ast.parse(fh.read())


def module_string(tree, variable):
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == variable for t in node.targets):
            return ast.literal_eval(node.value)
    raise KeyError(variable)


def function_string(tree, function, variable):
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == function:
            for inner in ast.walk(node):
                if isinstance(inner, ast.Assign) and any(isinstance(t, ast.Name) and t.id == variable for t in inner.targets):
                    return ast.literal_eval(inner.value)
    raise KeyError(f"{function}.{variable}")


ocr = parse("biometric_ocr")
validator = parse("image_validator")
u4k = parse("ultrasound_4k")
replicate = parse("ultrasound_4k_replicate")

texts = {
    "ocr_system": module_string(ocr, "SYSTEM_PROMPT"),
    "ocr_user": module_string(ocr, "USER_PROMPT"),
    "validator_system": function_string(validator, "validate_ultrasound_image", "system_msg"),
    "validator_prompt": function_string(validator, "validate_ultrasound_image", "prompt"),
    "gemini_system": function_string(u4k, "enhance_ultrasound_scientific", "system_message"),
    "replicate_system": function_string(replicate, "enhance_ultrasound_scientific_replicate", "system_message"),
    "replicate_model": module_string(replicate, "REPLICATE_MODEL"),
}

with open(out_path, "w", encoding="utf-8") as fh:
    json.dump(texts, fh, ensure_ascii=False, indent=1)
print("ok", {k: len(v) for k, v in texts.items()})
