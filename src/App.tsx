/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as todoService from './api/todos';
import { ErrorMessage, FilterStatus, Todo } from './types/Todo';
import { Header } from './components/Header';
import { TodoList } from './components/TodoList';
import { Footer } from './components/Footer';
import { Error } from './components/Error';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState(ErrorMessage.DEFAULT);
  const [isLoading, setIsLoading] = useState(false);
  const [todoStatus, setTodoStatus] = useState(FilterStatus.ALL);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loadingTodo, setLoadingTodo] = useState<number[]>([]);
  const [updateTodo, setUpdateTodo] = useState<number | null>(null);

  const handleError = useCallback((message: ErrorMessage) => {
    setErrorMessage(message);
    const timeoutId = setTimeout(() => {
      setErrorMessage(ErrorMessage.DEFAULT);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    setIsLoading(true);

    todoService
      .getTodos()
      .then(setTodos)
      .catch(() => handleError(ErrorMessage.LOAD))
      .finally(() => setIsLoading(false));
  }, [handleError]);

  const visibleTodos = todos.filter(todo => {
    switch (todoStatus) {
      case FilterStatus.ALL:
        return true;
      case FilterStatus.ACTIVE:
        return !todo.completed;
      case FilterStatus.COMPLETED:
        return todo.completed;
      default:
        return true;
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAddTodo = useCallback(
    ({ id, title, completed, userId }: Todo) => {
      if (!inputValue.trim()) {
        handleError(ErrorMessage.TITLE);

        return;
      }

      setTempTodo({ id, title, completed, userId });
      (inputRef.current as HTMLInputElement).disabled = true;

      todoService
        .addTodo({ title, completed, userId })
        .then(newTodo => {
          setTodos(currentTodos => [...currentTodos, newTodo]);
          setTempTodo(null);
          setInputValue('');
          (inputRef.current as HTMLInputElement).disabled = false;
          inputRef.current?.focus();
        })
        .catch(() => {
          handleError(ErrorMessage.ADD);
          setTempTodo(null);
          (inputRef.current as HTMLInputElement).disabled = false;
          inputRef.current?.focus();
        });
    },
    [handleError, inputValue],
  );

  const handleDeleteTodo = useCallback(
    (todoId: number) => {
      setLoadingTodo(prev => [...prev, todoId]);
      todoService
        .deleteTodo(todoId)
        .then(() => {
          const filteredTodos = todos.filter(todo => todo.id !== todoId);

          setTodos(filteredTodos);
          inputRef.current?.focus();
        })
        .catch(() => {
          handleError(ErrorMessage.DELETE);
          inputRef.current?.focus();
        })
        .finally(() =>
          setLoadingTodo(prev => prev.filter(id => id !== todoId)),
        );
    },
    [handleError, todos],
  );

  const handleDeleteCompletedTodo = useCallback(() => {
    const completedTodo = todos.filter(todo => todo.completed);

    if (!completedTodo.length) {
      return;
    }

    const idsDelete = completedTodo.map(todo => todo.id);

    setLoadingTodo(idsDelete);

    completedTodo.forEach(todo =>
      todoService
        .deleteTodo(todo.id)
        .then(() => {
          setTodos(currentTodos =>
            currentTodos.filter(item => item.id !== todo.id),
          );
          inputRef.current?.focus();
        })
        .catch(() => {
          handleError(ErrorMessage.DELETE);
          inputRef.current?.focus();
        })
        .finally(() => {
          setLoadingTodo([]);
        }),
    );
  }, [handleError, todos]);

  const handleUpdateTodo = useCallback(
    (updatedTodo: Todo) => {
      setLoadingTodo(prev => [...prev, updatedTodo.id]);
      todoService
        .updateTodo(updatedTodo)
        .then(() => {
          setTodos(currentTodos => {
            return currentTodos.map(item =>
              item.id === updatedTodo.id ? updatedTodo : item,
            );
          });
          setUpdateTodo(null);
        })
        .catch(() => {
          setLoadingTodo(loadingTodo.filter(id => id !== updatedTodo.id));
          handleError(ErrorMessage.UPDATE);
        })
        .finally(() => {
          setLoadingTodo(ids => ids.filter(id => id !== updatedTodo.id));
        });
    },
    [handleError, loadingTodo],
  );

  const handleChangeTodos = useCallback(() => {
    const areAllCompleted = todos.every(todo => todo.completed);
    const todosToUpdate = todos.filter(
      todo => todo.completed !== !areAllCompleted,
    );

    if (todosToUpdate.length === 0) {
      return;
    }

    setLoadingTodo(todosToUpdate.map(todo => todo.id));

    Promise.all(
      todosToUpdate.map(todo =>
        todoService.updateTodo({ ...todo, completed: !areAllCompleted }),
      ),
    )
      .then(updatedTodos => {
        setTodos(currentTodos =>
          currentTodos.map(todo => {
            const updated = updatedTodos.find(t => t.id === todo.id);

            return updated || todo;
          }),
        );
      })
      .catch(() => handleError(ErrorMessage.UPDATE))
      .finally(() => setLoadingTodo([]));
  }, [todos, handleError]);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          todos={todos}
          handleChangeTodos={handleChangeTodos}
          handleAddTodo={handleAddTodo}
          inputValue={inputValue}
          setInputValue={setInputValue}
          inputRef={inputRef}
        />

        {!isLoading && (
          <>
            <section className="todoapp__main" data-cy="TodoList">
              <TodoList
                visibleTodos={visibleTodos}
                handleDeleteTodo={handleDeleteTodo}
                loadingTodo={loadingTodo}
                handleUpdateTodo={handleUpdateTodo}
                updateTodo={updateTodo}
                setUpdateTodo={setUpdateTodo}
                tempTodo={tempTodo}
                inputRef={inputRef}
              />
            </section>
            {todos.length > 0 && (
              <Footer
                todos={todos}
                todoStatus={todoStatus}
                setTodoStatus={setTodoStatus}
                handleDeleteCompletedTodo={handleDeleteCompletedTodo}
              />
            )}
          </>
        )}
      </div>

      <Error errorMessage={errorMessage} setErrorMessage={setErrorMessage} />
    </div>
  );
};
