export const StateTag = ({ state }: { state: number }) => {
  return (
    <>
      {state == 0 && <div className="badge badge-info">Pending</div>}
      {state == 1 && <div className="badge badge-warning">Active</div>}
      {state == 2 && <div className="badge badge-error">Cancelled</div>}
      {state == 3 && <div className="badge badge-error">Defeated</div>}
      {state == 4 && <div className="badge badge-success">Queued</div>}
      {state == 5 && <div className="badge badge-success">Expired</div>}
      {state == 6 && <div className="badge badge-success">Executed</div>}
    </>
  );
};
