import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { compareVisualScreenshots } from './visual/compare'
import { visualFixture } from './visual/fixture'

describe('visual screenshot foundation', () => {
  it('provides one deterministic fixture for every cross-app visual surface', () => {
    expect(visualFixture.fixedNow).toBe('2026-11-13T12:00:00.000Z')
    expect(visualFixture.prototypeState.categories).toHaveLength(2)
    expect(visualFixture.prototypeState.notes.length).toBeGreaterThanOrEqual(3)
    expect(visualFixture.prototypeState.collaborators).toHaveLength(1)
    expect(visualFixture.contributors).toEqual([
      expect.objectContaining({
        id: 'collaborator-1',
        name: '周行',
        noteIds: ['note-keep-thinking'],
      }),
    ])
    expect(visualFixture.prototypeState.collaborationInvites).toHaveLength(1)
    expect(visualFixture.prototypeState.collaborationApplications).toHaveLength(1)
    expect(visualFixture.prototypeState.articleViewEvents.length).toBeGreaterThan(0)
    expect(visualFixture.production.notifications).toHaveLength(1)
    expect(visualFixture.maskSelectors).toContain('time')
  })

  it('detects identical and changed screenshots with a deterministic diff ratio', async () => {
    const image = await sharp({
      create: {
        width: 12,
        height: 12,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer()
    const changed = await sharp(image)
      .composite([
        {
          input: {
            create: {
              width: 4,
              height: 4,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 1 },
            },
          },
          left: 0,
          top: 0,
        },
      ])
      .png()
      .toBuffer()

    expect(await compareVisualScreenshots(image, image)).toMatchObject({
      width: 12,
      height: 12,
      changedPixels: 0,
      diffRatio: 0,
    })
    const different = await compareVisualScreenshots(image, changed)
    expect(different.changedPixels).toBe(16)
    expect(different.diffRatio).toBeCloseTo(16 / 144)
    expect(different.diffPng.length).toBeGreaterThan(0)
  })
})
