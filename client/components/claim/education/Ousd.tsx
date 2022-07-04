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
    question: "Which best describes OUSD?",
    answers: [
      "An algorithmic stablecoin",
      "A governance token",
      "A fully backed stablecoin",
      "A staking token",
    ],
    correctAnswer: "A fully backed stablecoin",
  },
  {
    question: "How do you earn yield with OUSD?",
    answers: [
      "You get OGV for locking it up",
      "The balance grows automatically in your wallet",
      "You stake it in the Origin Vault",
      "The price goes up over time",
    ],
    correctAnswer: "The balance grows automatically in your wallet",
  },
  {
    question: "Who manages OUSD's funds?",
    answers: [
      "Origin Protocol's team of Internet pioneers",
      "Every token holder chooses a strategy",
      "An elite group of ex-Wall Street traders",
      "A transparent set of automated smart contracts",
    ],
    correctAnswer: "Every token holder chooses a strategy",
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
        onCompleteMessage="Continue to learn about OGN"
      />
    </Card>
  </CardGroup>
);

export default Ousd;
