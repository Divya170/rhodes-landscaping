export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="wrap" style={{ paddingTop: 'clamp(128px,14vw,184px)', paddingBottom: 96 }}>
      <div className="skel" style={{ height: 12, width: 160, marginBottom: 28 }} />
      <div className="skel" style={{ height: 'clamp(48px,6vw,90px)', width: 'min(760px,92%)', marginBottom: 14 }} />
      <div className="skel" style={{ height: 'clamp(48px,6vw,90px)', width: 'min(520px,78%)', marginBottom: 48 }} />
      <div className="skel" style={{ height: 'clamp(260px,34vw,480px)' }} />
    </div>
  );
}
