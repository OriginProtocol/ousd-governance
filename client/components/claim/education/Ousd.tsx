import { FunctionComponent, Dispatch, SetStateAction } from "react";
import TokenIcon from "components/TokenIcon";
import Video from "components/Video";
import Quiz from "components/claim/education/Quiz";
import CardGroup from "components/CardGroup";
import Card from "components/Card";

interface OusdProps {
  onComplete?: () => void;
}

const questions = [
  {
    question: "OUSD question 1",
    answers: ["1", "2", "3", "4"],
    correctAnswer: "1",
  },
  {
    question: "OUSD question 2",
    answers: ["1", "2", "3", "4"],
    correctAnswer: "2",
  },
  {
    question: "OUSD question 3",
    answers: ["1", "2", "3", "4"],
    correctAnswer: "3",
  },
];

const Ousd: FunctionComponent<OusdProps> = ({ onComplete }) => (
  <CardGroup>
    <Card>
      <div className="space-y-4">
        <div className="flex items-center space-x-1">
          <TokenIcon src="/ousd-coin.svg" alt="OUSD" />
          <h3 className="text-lg leading-6 font-medium">
            Origin Dollar (OUSD)
          </h3>
        </div>
        <Video />
        <div className="text-sm lg:text-base text-gray-600 space-y-4">
          <p>
            OUSD is a yield-bearing stablecoin that grows in your wallet. It
            offers the simplest and safest way to earn passively from DeFi.
            Every unit of OUSD is backed 1:1 by the most trusted collateral in
            crypto, which means that it can be redeemed anytime. There&apos;s no
            complicated staking required and you don&apos;t have to trust the
            Origin team to manage your money. An open-source, fully-audited set
            of smart contracts governs the deployment of funds across
            conservative yield farming strategies using Aave, Compound, and
            Curve/Convex.
          </p>
          <p>
            Today, OUSD is an upgrade over ordinary stablecoins. Tomorrow,
            it&apos;s intended to be the default payment method for Web3. When
            you pay with OUSD or send it to a friend, the balance continues to
            grow when it’s received. Stablecoins are crucial to blockchain
            commerce, and OUSD is the innovation that will bring DeFi to the
            global economy.
          </p>
        </div>
      </div>
    </Card>
    <Card>
      <Quiz
        questions={questions}
        onComplete={onComplete}
        onCompleteMessage="Continue to learn about OGV"
      />
    </Card>
  </CardGroup>
);

export default Ousd;
