import hashlib
import hmac
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('verify_history', Path(__file__).parents[1] / 'tools/verify_history.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class HistoryVerificationTest(unittest.TestCase):
    def test_valid_and_tampered(self):
        body = '102000000003000000012000000045'
        signature = str(int.from_bytes(hmac.new(b'kkg', body.encode(), hashlib.sha256).digest(), 'big')).zfill(78)
        self.assertEqual(module.verify(body + signature), {'anzahl': 2, 'sekunden_pro_aufgabe': [12, 45], 'falsche_eingaben': 3})
        with self.assertRaises(ValueError):
            module.verify(body[:-1] + '6' + signature)
        with self.assertRaises(ValueError):
            module.verify((body + signature)[1:])

if __name__ == '__main__':
    unittest.main()
