import React from 'react';
import { Todo } from '../types/Todo';
import { TodoElement } from './TodoElement';

type Props = {
  visibleTodos: Todo[];
  handleDeleteTodo: (id: number) => void;
  loadingTodo: number[];
  handleUpdateTodo: (todo: Todo) => void;
  updateTodo: number | null;
  setUpdateTodo: (value: number | null) => void;
  tempTodo: Todo | null;
  inputRef: React.RefObject<HTMLInputElement>;
};

// eslint-disable-next-line react/display-name
export const TodoList: React.FC<Props> = React.memo(
  ({
    visibleTodos,
    handleDeleteTodo,
    loadingTodo,
    handleUpdateTodo,
    updateTodo,
    setUpdateTodo,
    tempTodo,
    inputRef,
  }: Props) => {
    return (
      <div data-cy="TodoList">
        {visibleTodos.map(todo => (
          <TodoElement
            todo={todo}
            key={todo.id}
            handleDeleteTodo={handleDeleteTodo}
            loadingTodo={loadingTodo}
            handleUpdateTodo={handleUpdateTodo}
            updateTodo={updateTodo}
            setUpdateTodo={setUpdateTodo}
            inputRef={inputRef}
          />
        ))}
        {tempTodo && (
          <TodoElement
            key={tempTodo.id}
            todo={tempTodo}
            handleDeleteTodo={() => {}}
            loadingTodo={[0]}
            handleUpdateTodo={() => {}}
            updateTodo={null}
            setUpdateTodo={() => {}}
            inputRef={inputRef}
          />
        )}
      </div>
    );
  },
);
