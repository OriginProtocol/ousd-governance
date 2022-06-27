import { FunctionComponent, useState, Dispatch, SetStateAction } from "react";
import classNames from "classnames";
import Button from "components/Button";
import CheckIconWhite from "components/CheckIconWhite";
import CrossIconWhite from "components/CrossIconWhite";

interface QuizQuestion {
  question: string;
  answers: Array<string>;
  correctAnswer: string;
}

interface QuizProps {
  questions: Array<QuizQuestion>;
  onComplete?: () => void | Dispatch<SetStateAction<boolean>>;
  onCompleteMessage?: string;
  lastQuiz?: Boolean;
}

const Quiz: FunctionComponent<QuizProps> = ({
  questions,
  onComplete,
  onCompleteMessage,
  lastQuiz,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [status, setStatus] = useState({
    type: "",
    message: "",
    note: "",
  });
  const [canProgress, setCanProgress] = useState(false);

  const quizComplete = currentQuestion === questions.length - 1;

  const handleAnswer = (answer: string) => {
    setCurrentAnswer(answer);

    if (answer === questions[currentQuestion].correctAnswer) {
      setStatus({
        type: "success",
        message: "That's right!",
        note: "",
      });
      setCanProgress(true);

      if (onComplete && quizComplete && lastQuiz) {
        onComplete(true);
      }
    } else {
      setStatus({
        type: "error",
        message: "Try again",
        note: "Don't worry, you'll still get the airdrop",
      });
      setCanProgress(false);

      if (onComplete && quizComplete && lastQuiz) {
        onComplete(false);
      }
    }
  };

  const handleNextQuestion = () => {
    setStatus({
      type: "",
      message: "",
      note: "",
    });
    setCurrentAnswer("");
    setCanProgress(false);

    if (currentQuestion < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    }

    return;
  };

  const letterMap = ["A", "B", "C", "D"];

  return (
    <div className="space-y-1">
      <span className="text-sm text-gray-600">
        Question {currentQuestion + 1} of {questions.length}
      </span>
      <div className="space-y-4">
        {questions.map((q, index) => {
          const { question, answers, correctAnswer } = q;

          if (index !== currentQuestion) return null;

          return (
            <div key={question} className="space-y-4">
              <h3 className="text-xl font-bold">{question}</h3>
              <ul className="space-y-2">
                {answers.map((answer, index) => {
                  const isCurrent = currentAnswer === answer;
                  const isCorrect = currentAnswer === correctAnswer;

                  const discClasses = classNames(
                    "bg-gray-500 text-white font-bold h-8 w-8 p-2 flex items-center justify-center rounded-full",
                    {
                      "bg-green-500": isCurrent && isCorrect,
                      "bg-orange-500": isCurrent && !isCorrect,
                      "bg-gray-500": !isCurrent,
                    }
                  );

                  const answerClasses = classNames(
                    "border rounded p-3 flex items-center space-x-3 w-full",
                    {
                      "bg-green-200 border-green-400": isCurrent && isCorrect,
                      "bg-orange-200 border-orange-400":
                        isCurrent && !isCorrect,
                      "border-gray-300 hover:bg-gray-100": !isCurrent,
                    }
                  );

                  return (
                    <li key={answer}>
                      <button
                        className={answerClasses}
                        onClick={() => handleAnswer(answer)}
                      >
                        <span className={discClasses}>
                          {isCurrent ? (
                            <>
                              {isCorrect ? (
                                <CheckIconWhite />
                              ) : (
                                <CrossIconWhite />
                              )}
                            </>
                          ) : (
                            <span className="text-white">
                              {letterMap[index]}
                            </span>
                          )}
                        </span>
                        <span>{answer}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {status?.type && (
          <div className="text-center">
            {status.message && <p>{status.message}</p>}
            {status.note && (
              <p className="text-sm text-gray-600">{status.note}</p>
            )}
            {canProgress && quizComplete && (
              <p className="text-sm text-gray-600">
                {onCompleteMessage
                  ? onCompleteMessage
                  : "It's time to claim the airdrop"}
              </p>
            )}
          </div>
        )}
        {canProgress && !quizComplete && (
          <Button onClick={handleNextQuestion} large fullWidth>
            Next Question
          </Button>
        )}
        {onComplete && quizComplete && canProgress && !lastQuiz && (
          <Button onClick={onComplete} large fullWidth>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
