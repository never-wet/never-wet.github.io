import type { CSSProperties } from 'react'
import type { ValuePillar } from '../data/siteContent'
import { useLocale } from '../i18n'

type ValueStoryStageProps = {
  activeIndex: number
  progress: number
  sceneId: ValuePillar['sceneId']
  variant?: 'sticky' | 'chapter'
}

const stageScenes: Array<{
  id: ValuePillar['sceneId']
}> = [
  { id: 'nexus' },
  { id: 'atlas' },
  { id: 'characters' },
  { id: 'narrative' },
  { id: 'writing' },
]

function renderScene(sceneId: ValuePillar['sceneId'], t: (text: string) => string) {
  switch (sceneId) {
    case 'nexus':
      return (
        <>
          <div className="value-scene__plate value-scene__plate--nexus" />
          <div className="value-scene__beam value-scene__beam--nexus-a" />
          <div className="value-scene__beam value-scene__beam--nexus-b" />
          <div className="value-scene__beam value-scene__beam--nexus-c" />
          <div className="value-scene__node value-scene__node--nexus-a">
            <span>{t('World')}</span>
          </div>
          <div className="value-scene__node value-scene__node--nexus-b">
            <span>{t('Cast')}</span>
          </div>
          <div className="value-scene__node value-scene__node--nexus-c">
            <span>{t('History')}</span>
          </div>
          <div className="value-scene__slab value-scene__slab--nexus">
            <span>{t('Manuscript')}</span>
          </div>
        </>
      )
    case 'atlas':
      return (
        <>
          <div className="value-scene__plate value-scene__plate--atlas-back" />
          <div className="value-scene__plate value-scene__plate--atlas-mid" />
          <div className="value-scene__plate value-scene__plate--atlas-front" />
          <div className="value-scene__ring value-scene__ring--atlas" />
          <div className="value-scene__pin value-scene__pin--atlas-a">
            <span>{t('Harbor')}</span>
          </div>
          <div className="value-scene__pin value-scene__pin--atlas-b">
            <span>{t('Orchard')}</span>
          </div>
          <div className="value-scene__pin value-scene__pin--atlas-c">
            <span>{t('Rites')}</span>
          </div>
        </>
      )
    case 'characters':
      return (
        <>
          <div className="value-scene__ring value-scene__ring--characters" />
          <div className="value-scene__link value-scene__link--characters-a" />
          <div className="value-scene__link value-scene__link--characters-b" />
          <div className="value-scene__link value-scene__link--characters-c" />
          <div className="value-scene__prism value-scene__prism--characters-a">
            <span>Mira</span>
          </div>
          <div className="value-scene__prism value-scene__prism--characters-b">
            <span>Vey</span>
          </div>
          <div className="value-scene__prism value-scene__prism--characters-c">
            <span>Toma</span>
          </div>
          <div className="value-scene__core value-scene__core--characters">
            <span>{t('Faction pressure')}</span>
          </div>
        </>
      )
    case 'narrative':
      return (
        <>
          <div className="value-scene__track value-scene__track--narrative" />
          <div className="value-scene__thread value-scene__thread--narrative" />
          <div className="value-scene__event value-scene__event--narrative-a">
            <span>{t('Inciting')}</span>
          </div>
          <div className="value-scene__event value-scene__event--narrative-b">
            <span>{t('Reversal')}</span>
          </div>
          <div className="value-scene__event value-scene__event--narrative-c">
            <span>{t('Reveal')}</span>
          </div>
          <div className="value-scene__event value-scene__event--narrative-d">
            <span>{t('Climax')}</span>
          </div>
        </>
      )
    case 'writing':
      return (
        <>
          <div className="value-scene__desk value-scene__desk--writing" />
          <div className="value-scene__sheet value-scene__sheet--writing">
            <span>{t('Draft')}</span>
          </div>
          <div className="value-scene__drawer value-scene__drawer--writing" />
          <div className="value-scene__chip value-scene__chip--writing-a">{t('Lore')}</div>
          <div className="value-scene__chip value-scene__chip--writing-b">{t('Timeline')}</div>
          <div className="value-scene__chip value-scene__chip--writing-c">{t('Characters')}</div>
          <div className="value-scene__halo value-scene__halo--writing" />
        </>
      )
  }
}

export function ValueStoryStage({
  activeIndex,
  progress,
  sceneId,
  variant = 'sticky',
}: ValueStoryStageProps) {
  const { t } = useLocale()
  const stageStyle = {
    '--scene-progress': progress.toFixed(3),
    '--scene-lift': `${(progress * 54).toFixed(1)}px`,
    '--scene-lift-soft': `${(progress * 30).toFixed(1)}px`,
    '--scene-depth': `${(progress * 108).toFixed(1)}px`,
    '--scene-depth-soft': `${(progress * 58).toFixed(1)}px`,
    '--scene-tilt': `${(progress * 24).toFixed(2)}deg`,
    '--scene-drift': `${(progress * 52).toFixed(1)}px`,
    '--scene-drift-negative': `${(progress * -52).toFixed(1)}px`,
    '--scene-glow': `${(0.2 + progress * 0.34).toFixed(3)}`,
    '--scene-reveal': `${(0.26 + progress * 0.74).toFixed(3)}`,
    '--scene-line-scale': `${(0.28 + progress * 0.72).toFixed(3)}`,
    '--scene-orbit': `${(progress * 36).toFixed(2)}deg`,
  } as CSSProperties

  return (
    <div className={`value-stage value-stage--${sceneId} value-stage--${variant}`} style={stageStyle} aria-hidden="true">
      <div className="value-stage__viewport">
        <div className="value-stage__ambient" />
        <div className="value-stage__nebula" />
        <div className="value-stage__floor" />

        {stageScenes.map((scene, index) => (
          <div
            className={`value-scene ${index === activeIndex ? 'value-scene--active' : ''}`}
            key={scene.id}
          >
            {renderScene(scene.id, t)}
          </div>
        ))}
      </div>
    </div>
  )
}
