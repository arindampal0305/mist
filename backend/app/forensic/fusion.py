class DempsterShaferCombiner:
    """
    Fuses belief masses over the frame of discernment: {GENUINE, FAKE, UNKNOWN}
    Applies the orthogonal sum rule to integrate modular signals.
    """
    @staticmethod
    def fuse_masses(m1: dict, m2: dict) -> dict:
        K = (m1['G'] * m2['F']) + (m1['F'] * m2['G'])
        
        if K >= 0.99:
            return {
                'G': min(m1['G'], m2['G']),
                'F': max(m1['F'], m2['F']),
                'U': 1.0 - (min(m1['G'], m2['G']) + max(m1['F'], m2['F']))
            }
            
        scale = 1.0 / (1.0 - K)
        
        fused_G = (m1['G'] * m2['G'] + m1['G'] * m2['U'] + m1['U'] * m2['G']) * scale
        fused_F = (m1['F'] * m2['F'] + m1['F'] * m2['U'] + m1['U'] * m2['F']) * scale
        fused_U = (m1['U'] * m2['U']) * scale
        
        total = fused_G + fused_F + fused_U
        return {
            'G': fused_G / total,
            'F': fused_F / total,
            'U': fused_U / total
        }

    @classmethod
    def fuse_ensemble(cls, modules_masses: list[dict]) -> dict:
        result = modules_masses[0]
        for next_mass in modules_masses[1:]:
            result = cls.fuse_masses(result, next_mass)
        return result
