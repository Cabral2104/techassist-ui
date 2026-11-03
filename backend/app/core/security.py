import hashlib
import secrets


def hash_password(password: str) -> str:
    """
    Genera un hash seguro utilizando PBKDF2-HMAC-SHA256 con sal aleatoria de 16 bytes.
    Formato almacenado: pbkdf2_sha256$<iteraciones>$<salt_hex>$<hash_hex>
    """
    iterations = 100_000
    salt = secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        iterations,
    )
    return f"pbkdf2_sha256${iterations}${salt}${derived.hex()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """
    Verifica si una contraseña en texto plano coincide con el hash almacenado.
    """
    try:
        algorithm, iterations_str, salt, hash_hex = stored_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iterations_str)
        derived = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            bytes.fromhex(salt),
            iterations,
        )
        return secrets.compare_digest(derived.hex(), hash_hex)
    except Exception:
        return False

