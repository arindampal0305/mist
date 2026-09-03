class ICAO9303Validator:
    """
    Implements the official ICAO Document 9303 check digit calculation.
    Character mapping: 0-9 = 0-9, A-Z = 10-35, '<' = 0
    Weighting sequence: 7, 3, 1, 7, 3, 1... (repeating)
    Formula: Sum(Value * Weight) % 10
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
        Parses standard 44-character 2-line TD3 Passport MRZ formats.
        """
        if len(line1) != 44 or len(line2) != 44:
            raise ValueError("Invalid TD3 MRZ line length. Must be 44 characters.")

        doc_num = line2[0:9]
        doc_num_check = line2[9]
        
        dob_raw = line2[13:19]
        dob_check = line2[19]
        
        expiry_raw = line2[21:27]
        expiry_check = line2[27]
        
        personal_number = line2[28:42]
        personal_number_check = line2[42]
        
        composite_string = doc_num + doc_num_check + dob_raw + dob_check + expiry_raw + expiry_check + personal_number + personal_number_check
        composite_check = line2[43]

        calc_doc = cls.calculate_check_digit(doc_num)
        calc_dob = cls.calculate_check_digit(dob_raw)
        calc_exp = cls.calculate_check_digit(expiry_raw)
        calc_pers = cls.calculate_check_digit(personal_number)
        calc_comp = cls.calculate_check_digit(composite_string[:-1])

        return {
            "document_number": {
                "val": doc_num.replace("<", ""),
                "expected": int(doc_num_check),
                "calculated": calc_doc,
                "passed": int(doc_num_check) == calc_doc
            },
            "dob": {
                "val": f"19{dob_raw[0:2]}-{dob_raw[2:4]}-{dob_raw[4:6]}",
                "expected": int(dob_check),
                "calculated": calc_dob,
                "passed": int(dob_check) == calc_dob
            },
            "expiry": {
                "val": f"20{expiry_raw[0:2]}-{expiry_raw[2:4]}-{expiry_raw[4:6]}",
                "expected": int(expiry_check),
                "calculated": calc_exp,
                "passed": int(expiry_check) == calc_exp
            },
            "composite": {
                "expected": int(composite_check),
                "calculated": calc_comp,
                "passed": int(composite_check) == calc_comp
            }
        }
