import { PARTNER_GUIDE } from '../data/partnerTips';

// Communication partner training in brief: how the person next to the learner can help in any conversation.
export function PartnerGuide() {
  return <details className="practice-settings partner-guide">
    <summary>Для близьких: як розмовляти, щоб було легше</summary>
    <div className="practice-settings__body">
      <p>Навчання близьких способам розмови має добру доказову базу: воно полегшує спілкування людини з афазією не лише під час занять, а й щодня. Ось головне. У кожному завданні також є кнопка «Як допомогти» з порадами саме для нього.</p>
      <ol className="partner-guide__list">{PARTNER_GUIDE.map(([title, text]) => <li key={title}><strong>{title}</strong><span>{text}</span></li>)}</ol>
      <p className="form-note"><a href="https://doi.org/10.1016/j.apmr.2016.03.023" target="_blank" rel="noreferrer">Simmons-Mackie та ін., 2016: огляд навчання співрозмовників</a>. Логопед може показати ці прийоми наживо, попросіть про це.</p>
    </div>
  </details>;
}
