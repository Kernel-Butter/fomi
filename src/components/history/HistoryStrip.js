import Image from 'next/image';
import Icon from '../Icon';

export default function HistoryStrip({ type, onSelect, stripRef, historyGroups = [] }) {
  return <section className="history-strip" aria-label={`${type === 'video' ? 'Video' : 'Image'} generation history`}>
    <div className="history-label">
      <strong>History</strong>
      <button type="button" onClick={() => stripRef.current?.scrollTo({ left: stripRef.current.scrollWidth, behavior: 'smooth' })}>View All</button>
    </div>
    <div className="history-scroll" ref={stripRef} tabIndex={0} aria-label="Browse history">
      {historyGroups.map(group => {
        const stacked = group.items.length > 1;
        return <button type="button" key={group.id}
          className={stacked ? 'history-stack' : undefined}
          onClick={() => onSelect(group.id)}
          aria-label={`Open generation: ${group.prompt}, ${group.items.length} ${type === 'video' ? 'videos' : 'images'}`}>
          {group.items.slice(0, 3).map((item, index) => <span key={item.id}
            className="history-thumbnail-layer"
            style={stacked ? { transform: `translate(${-index * 3}px, ${-index * 3}px)`, zIndex: 3 - index } : undefined}>
            <Image src={item.poster || item.src} alt={index === 0 ? group.prompt : ''} fill sizes="72px"/>
          </span>)}
          {stacked && <span className="history-count" aria-hidden="true">{group.items.length}</span>}
          {type === 'video' && <span className="history-video"><Icon name="play" size={12}/></span>}
        </button>;
      })}
    </div>
    <div className="history-fade"/>
  </section>;
}
