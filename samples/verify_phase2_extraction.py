import json
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def verify_upload(sample_path: str, filename: str, mime: str):
    print(f"\n=======================================================")
    print(f"Testing Upload: {filename}")
    print(f"=======================================================")
    with open(sample_path, "rb") as f:
        content = f.read()
    
    res = client.post(
        "/api/documents/upload",
        files={"file": (filename, content, mime)}
    )
    assert res.status_code == 200, f"Upload failed: {res.text}"
    data = res.json()
    
    print(f"Document ID       : {data['document_id']}")
    print(f"Filename          : {data['filename']}")
    print(f"Document Type     : {data['document_type']}")
    print(f"Page Count        : {data['page_count']}")
    print(f"Clause Count      : {data['clause_count']}")
    print(f"Processing Status : {data['processing_status']}")
    print(f"\nNormalized Internal Representation Hierarchy:")
    print(f"Document ({data['document_id']})")
    print(f" |-- metadata: word_count={data['metadata']['total_words']}, char_count={data['metadata']['total_chars']}")
    print(f" |-- sections ({len(data['sections'])}):")
    for sec in data["sections"]:
        print(f"      |-- {sec['section_id']}: \"{sec['title']}\"")
        for cl in sec["clauses"]:
            print(f"      |    |-- [{cl['clause_id']}] ({cl['clause_number']}) {cl['original_text'][:60]}... [Page {cl['page']}]")

if __name__ == "__main__":
    verify_upload("samples/Enterprise_SaaS_Agreement.txt", "Enterprise_SaaS_Agreement.txt", "text/plain")
    verify_upload("samples/Sample_NDA_Agreement.docx", "Sample_NDA_Agreement.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    verify_upload("samples/sample_contract.pdf", "sample_contract.pdf", "application/pdf")
