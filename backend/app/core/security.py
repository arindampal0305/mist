import hmac
import hashlib

WATCHLIST_HASHES = {
    hashlib.sha256("Z11122233".encode()).hexdigest()
}

def generate_hmac_sha256(key: str, message: str) -> str:
    return hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest()

def verify_hmac_sha256(key: str, message: str, signature: str) -> bool:
    expected = generate_hmac_sha256(key, message)
    return hmac.compare_digest(expected, signature)

def compute_document_hash(doc_number: str) -> str:
    return hashlib.sha256(doc_number.encode()).hexdigest()

def check_watchlist(doc_number: str) -> bool:
    return compute_document_hash(doc_number) in WATCHLIST_HASHES
