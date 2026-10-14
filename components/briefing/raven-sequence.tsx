import { operators, statLabels } from "@/lib/operators";
import { OperatorArchive } from "./operator-archive";
import { CipherInteraction } from "./cipher-interaction";

export function RavenSequence() {
  return (
    <section id="raven" className="raven" data-chapter aria-labelledby="raven-title">
      <div className="raven-intro container">
        <p className="chapter-label system-label"><span>03 / OPERATORS</span><span>TF-5 // RAVEN</span></p>
        <div className="raven-intro-heading" data-reveal>
          <p>FIVE OPERATORS.<br /><span>ONE DIRECTIVE.</span></p>
          <h2 id="raven-title">MEET RAVEN.</h2>
        </div>
      </div>
      <OperatorArchive>
        {operators.map((operator) => (
            <div key={operator.id} className="operator-intel">
              <p className="operator-index system-label">{operator.number} / {operator.division}</p>
              <p className="operator-name">{operator.name}</p>
              <h3 id={`${operator.id}-title`} tabIndex={-1}>{operator.callsign}</h3>
              <p className="operator-role">{operator.role}<span>{operator.nationality}</span></p>
              <p className="operator-primary"><span>{operator.primary} <span aria-hidden="true">{"//"}</span></span><strong>{operator.score}</strong></p>
              <div className="operator-capability">
                <p className="system-label">SIGNATURE CAPABILITY</p>
                <h4>{operator.ability}</h4>
                <p>{operator.capability}</p>
              </div>
              <dl className="operator-stats" aria-label={`${operator.callsign} intelligence statistics`}>
                {statLabels.map((label, statIndex) => <div key={label}><dt>{label}</dt><dd>{operator.stats[statIndex]}</dd></div>)}
              </dl>
              {operator.id === "cipher" && <CipherInteraction />}
              {"quote" in operator && <blockquote>“{operator.quote}”</blockquote>}
            </div>
        ))}
      </OperatorArchive>
      <div className="raven-closing container" data-reveal>
        <ol className="unit-five" aria-label="Five Raven operators united">{operators.map((operator) => <li key={operator.id}>{operator.number}</li>)}</ol>
        <p className="unit-name">RAVEN</p>
        <p className="system-label">TF-5</p>
        <p className="unit-promise">FIVE GO IN.<br />FIVE COME OUT.</p>
      </div>
    </section>
  );
}
