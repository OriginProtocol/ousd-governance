import { useRouter } from "next/router";

export const ProposalPreview = ({ proposal, state, index }) => {
  const router = useRouter();

  return (
    <tr
      className="hover cursor-pointer"
      onClick={() => router.push(`/proposal/${proposal.id}`)}
    >
      <td>{proposal[0].toString()}</td>
      <td>{proposal[1]} </td>
      <td>
        {state == 0 && "Pending"}
        {state == 1 && "Queued"}
        {state == 2 && "Expired"}
        {state == 3 && "Executed"}
      </td>
    </tr>
  );
};
