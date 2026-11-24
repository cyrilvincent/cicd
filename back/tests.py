import unittest
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

