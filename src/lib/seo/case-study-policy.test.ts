import { describe, expect, it } from 'vitest';
import { CASE_STUDIES } from '@/content/case-studies';
import { CASE_STUDY_SEO } from '@/lib/seo/metadata';

describe('case-study publication policy', () => {
  it('keeps concept studies visibly and technically classified as concepts', () => {
    const concepts = CASE_STUDIES.filter((study) => study.proofType === 'concept');
    expect(concepts).toHaveLength(2);
    for (const study of concepts) {
      const seo = CASE_STUDY_SEO[study.slug];
      expect(seo?.indexable).toBe(false);
      expect(seo?.title.toLowerCase()).toContain('koncept');
      expect(study.disclaimer?.toLowerCase()).toContain('koncept');
    }
  });

  it('requires a manual publication decision for currently delivered studies', () => {
    const delivered = CASE_STUDIES.filter((study) => study.proofType === 'delivered_project');
    expect(delivered).toHaveLength(2);
    for (const study of delivered) {
      expect(CASE_STUDY_SEO[study.slug]?.indexable).toBe(false);
      expect(study.verifiedResults).toBeUndefined();
      expect(study.disclaimer).toMatch(/bez neoverených tvrdení|neboli verejne overené/i);
    }
  });
});

