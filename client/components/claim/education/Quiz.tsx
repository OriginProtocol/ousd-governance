import { FunctionComponent, useState, Dispatch, SetStateAction } from "react";
import classNames from "classnames";
import Button from "components/Button";
import CheckIconWhite from "components/CheckIconWhite";
import CrossIconWhite from "components/CrossIconWhite";
import { shuffle } from "lodash";

interface QuizQuestion {
  question: string;
  answers: Array<string>;
  correctAnswer: string;
  canAdvance?: Boolean;
}

interface QuizProps {
  questions: Array<QuizQuestion>;
  onComplete?: () => void | Dispatch<SetStateAction<boolean>>;
  onCompleteMessage?: string;
  lastQuiz?: Boolean;
  handleNextStep?: () => void;
}

const Quiz: FunctionComponent<QuizProps> = ({
  questions,
  onComplete,
  onCompleteMessage,
  lastQuiz,
  handleNextStep,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentAnswers, setCurrentAnswers] = useState(
    shuffle(questions[currentQuestion].answers)
  );
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [status, setStatus] = useState({
    type: "",
    message: "",
    note: "",
  });
  const [canProgress, setCanProgress] = useState(false);

  const quizComplete = currentQuestion === questions.length - 1;

  const handleSubmitAnswer = () => {
    if (currentAnswer === questions[currentQuestion].correctAnswer) {
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
        message: "Sorry, that's incorrect",
        note: "",
      });
      setCanProgress(false);

      if (onComplete && quizComplete && lastQuiz) {
        onComplete(false);
      }
    }
  };

  const handleResetQuestion = () => {
    setStatus({
      type: "",
      message: "",
      note: "",
    });
    setCurrentAnswer("");
    setCanProgress(false);

    if (currentQuestion < questions.length) {
      setCurrentQuestion(currentQuestion);
      setCurrentAnswers(shuffle(questions[currentQuestion].answers));
    }

    return;
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
      setCurrentAnswers(shuffle(questions[currentQuestion + 1].answers));
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
          const { question, correctAnswer } = q;

          if (index !== currentQuestion) return null;

          return (
            <div key={question} className="space-y-4">
              <h3 className="text-xl font-bold">{question}</h3>
              <ul className="space-y-2">
                {currentAnswers.map((answer, index) => {
                  const isCurrent = currentAnswer === answer;
                  const isCorrect = currentAnswer === correctAnswer;

                  const discClasses = classNames(
                    "flex-shrink-0 bg-gray-500 text-white font-bold h-8 w-8 p-2 flex items-center justify-center rounded-full",
                    {
                      "bg-green-500":
                        isCurrent && isCorrect && status?.type === "success",
                      "bg-orange-500":
                        isCurrent && !isCorrect && status?.type === "error",
                      "bg-gray-500": !isCurrent,
                    }
                  );

                  const answerClasses = classNames(
                    "text-left border rounded p-3 flex items-center space-x-3 w-full",
                    {
                      "bg-green-200 border-green-400":
                        isCorrect && status?.type === "success",
                      "bg-orange-200 border-orange-400":
                        !isCorrect && status?.type === "error",
                      "border-gray-400 bg-gray-300":
                        isCurrent && status?.type === "",
                      "border-gray-300 hover:bg-gray-100 disabled:bg-white":
                        !isCurrent,
                    }
                  );

                  return (
                    <li key={answer}>
                      <button
                        className={answerClasses}
                        onClick={() => setCurrentAnswer(answer)}
                        disabled={status.type !== ""}
                      >
                        <span className={discClasses}>
                          {isCurrent && status.type !== "" ? (
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
        {!canProgress && currentAnswer && status?.type === "" && (
          <Button onClick={handleSubmitAnswer} large fullWidth>
            Submit Answer
          </Button>
        )}
        {!canProgress && status?.type === "error" && (
          <Button onClick={handleResetQuestion} large fullWidth alt>
            Try Again
          </Button>
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
        {quizComplete && canProgress && lastQuiz && handleNextStep && (
          <Button onClick={handleNextStep} large fullWidth>
            Claim Airdrop
          </Button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
