import unittest

import config
from service import MyService


class UnitTests(unittest.TestCase):

    def test_service_add_1(self):
        s = MyService()
        result = s.add(1, 2)
        self.assertEqual(result, 3)

    def test_service_multiply_1(self):
        s = MyService()
        result = s.multiply(3, 2)
        self.assertEqual(result, 6)

    def test_credentials(self):
        s = MyService()
        result = s.get_credentials()
        self.assertIsNotNone(result)
        print(result)

    def test_version(self):
        version = config.version
        self.assertIsNotNone(version)
        print(version, config.env)


