class ICAO9303Validator:
    """
    Implements the official ICAO Document 9303 check digit calculation.

    Character mapping:
        0-9 = 0-9
        A-Z = 10-35
        '<' = 0

    Weighting sequence:
        7, 3, 1, 7, 3, 1... (repeating)

    Formula:
        Sum(Value * Weight) % 10
    """

    @staticmethod
    def char_to_val(char: str) -> int:
        if '0' <= char <= '9':
            return int(char)
        elif 'A' <= char <= 'Z':
            return ord(char) - ord('A') + 10
        elif char == '<':
            return 0

        raise ValueError(f"Invalid character in MRZ: {char}")

    @classmethod
    def calculate_check_digit(cls, data_string: str) -> int:
        weights = [7, 3, 1]
        total = 0

        for idx, char in enumerate(data_string):
            val = cls.char_to_val(char)
            weight = weights[idx % 3]
            total += val * weight

        return total % 10

    @classmethod
    def parse_passport_td3(cls, line1: str, line2: str) -> dict:
        """
        Parses standard 44-character, 2-line TD3 Passport MRZ.
        """

        # Remove accidental spaces
        line1 = line1.replace(" ", "").strip().upper()
        line2 = line2.replace(" ", "").strip().upper()

        if len(line1) != 44 or len(line2) != 44:
            raise ValueError(
                "Invalid TD3 MRZ line length. Must be 44 characters."
            )

        # -----------------------------
        # Document Number
        # -----------------------------
        doc_num = line2[0:9]
        doc_num_check = line2[9]

        # -----------------------------
        # Date of Birth
        # -----------------------------
        dob_raw = line2[13:19]
        dob_check = line2[19]

        # -----------------------------
        # Expiry Date
        # -----------------------------
        expiry_raw = line2[21:27]
        expiry_check = line2[27]

        # -----------------------------
        # Personal Number
        # -----------------------------
        personal_number = line2[28:42]
        personal_number_check = line2[42]

        # -----------------------------
        # Composite Check
        # -----------------------------
        composite_string = (
            doc_num
            + doc_num_check
            + dob_raw
            + dob_check
            + expiry_raw
            + expiry_check
            + personal_number
            + personal_number_check
        )

        composite_check = line2[43]

        # -----------------------------
        # Calculate Check Digits
        # -----------------------------
        calc_doc = cls.calculate_check_digit(doc_num)
        calc_dob = cls.calculate_check_digit(dob_raw)
        calc_exp = cls.calculate_check_digit(expiry_raw)
        calc_pers = cls.calculate_check_digit(personal_number)

        calc_comp = cls.calculate_check_digit(composite_string)

        # -----------------------------
        # Safe Check Digit Validation
        # -----------------------------
        def validate_check_digit(
            expected: str,
            calculated: int
        ) -> dict:

            if expected.isdigit():
                expected_value = int(expected)

                return {
                    "expected": expected_value,
                    "calculated": calculated,
                    "passed": expected_value == calculated
                }

            return {
                "expected": expected,
                "calculated": calculated,
                "passed": False
            }

        doc_result = validate_check_digit(
            doc_num_check,
            calc_doc
        )

        dob_result = validate_check_digit(
            dob_check,
            calc_dob
        )

        expiry_result = validate_check_digit(
            expiry_check,
            calc_exp
        )

        personal_result = validate_check_digit(
            personal_number_check,
            calc_pers
        )

        composite_result = validate_check_digit(
            composite_check,
            calc_comp
        )

        # -----------------------------
        # Final Response
        # -----------------------------
        return {
            "document_number": {
                "val": doc_num.replace("<", ""),
                **doc_result
            },

            "dob": {
                "val": f"19{dob_raw[0:2]}-{dob_raw[2:4]}-{dob_raw[4:6]}",
                **dob_result
            },

            "expiry": {
                "val": f"20{expiry_raw[0:2]}-{expiry_raw[2:4]}-{expiry_raw[4:6]}",
                **expiry_result
            },

            "personal_number": {
                "val": personal_number.replace("<", ""),
                **personal_result
            },

            "composite": composite_result
        }