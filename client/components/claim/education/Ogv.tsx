import { FunctionComponent } from "react";
import TokenIcon from "components/TokenIcon";
import Video from "components/Video";
import Card from "components/Card";
import CardGroup from "components/CardGroup";
import Quiz from "components/claim/education/Quiz";

interface OgvProps {
  onComplete?: () => void;
}

const questions = [
  {
    question: "OGV question 1",
    answers: ["1", "2", "3", "4"],
    correctAnswer: "1",
  },
  {
    question: "OGV question 2",
    answers: ["1", "2", "3", "4"],
    correctAnswer: "2",
  },
  {
    question: "OGV question 3",
    answers: ["1", "2", "3", "4"],
    correctAnswer: "3",
  },
];

const Ogv: FunctionComponent<OgvProps> = ({ onComplete }) => (
  <CardGroup>
    <Card>
      <div className="space-y-4">
        <div className="flex items-center space-x-1">
          <TokenIcon src="/ogv.svg" alt="OGV" />
          <h3 className="text-lg leading-6 font-medium">
            Origin Dollar Governance (OGV)
          </h3>
        </div>
        <Video />
        <div className="text-sm lg:text-base text-gray-600 space-y-4">
          <p>
            OUSD is not controlled by a corporate entity or a central bank.
            It&apos;s governed by a community of token holders who share the
            long-term vision for creating a superior stablecoin. OGV serves as
            the governance and value accrual token for OUSD and it&apos;s being
            widely distributed to members of the Origin community.
          </p>
          <p>
            With OGV comes the power to shape OUSD and benefit from its growth.
            Holders of OGV are able to lock their tokens for up to four years to
            gain voting rights and earn fees. When OGV is locked, it&apos;s
            converted into veOGV (vote-escrowed OGV) and it becomes
            non-transferable.
          </p>
          <p>
            Every aspect of OUSD is controlled by decentralized governance.
            Supporting new collateral types, allocating funds across different
            strategies, and adjusting staking rewards are all examples of
            decisions that are made by veOGV holders. On day one, veOGV holders
            are able to claim 10% of the yield that is generated by the
            protocol. As OUSD adoption accelerates, the benefits accrue to the
            holders of veOGV.
          </p>
        </div>
      </div>
    </Card>
    <Card>
      <Quiz
        questions={questions}
        onComplete={onComplete}
        onCompleteMessage="Continue to learn about OGN"
      />
    </Card>
  </CardGroup>
);

export default Ogv;