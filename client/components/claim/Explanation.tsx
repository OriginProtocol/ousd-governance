import { FunctionComponent, useState } from "react";
import { SectionTitle } from "components/SectionTitle";
import Card from "components/Card";
import SlideTracker from "components/SlideTracker";
import SlideNav from "components/SlideNav";
import Ogn from "components/claim/explanation/Ogn";
import Ousd from "components/claim/explanation/Ousd";
import Ogv from "components/claim/explanation/Ogv";
import VeOgv from "components/claim/explanation/VeOgv";

interface ExplanationProps {}

const Explanation: FunctionComponent<ExplanationProps> = () => {
  const [currentProduct, setCurrentProduct] = useState(0);
  const products = ["$OGN", "$OUSD", "$OGV", "$veOGV"];

  const handleChangeProduct = (dot: number) => setCurrentProduct(dot);

  return (
    <Card>
      <SectionTitle>Origin products</SectionTitle>
      <p className="text-sm text-gray-600 mb-8">
        If your wallet is eligible, you&apos;ll be able to claim your OGV/veOGV
        soon. But first, here&apos;s more about the tokens that drive the
        protocol and their benefits.
      </p>
      <div className="space-y-2">
        <div className="relative">
          {/* <SlideNav /> */}
          <Card alt>
            {currentProduct === 0 && <Ogn />}
            {currentProduct === 1 && <Ousd />}
            {currentProduct === 2 && <Ogv />}
            {currentProduct === 3 && <VeOgv />}
          </Card>
        </div>
        <SlideTracker
          currentSlide={currentProduct}
          slides={products}
          onDotClick={handleChangeProduct}
        />
      </div>
    </Card>
  );
};
export default Explanation;
