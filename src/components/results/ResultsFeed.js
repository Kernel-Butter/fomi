import GenerationGroup from './GenerationGroup';
import EmptyState from './EmptyState';
export default function ResultsFeed({ groups,onSample,error }) { return <>{error && <p className="error-message" role="alert">{error}</p>}{groups.length ? <div className="results-feed">{groups.map((group,i) => <GenerationGroup key={group.id} group={group} first={i === 0}/>)}</div> : <EmptyState onSample={onSample}/>}</>; }
