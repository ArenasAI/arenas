import { Node } from 'prosemirror-model';
import { PluginKey, Plugin, EditorState } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { createRoot } from 'react-dom/client';
import { Suggestion as PreviewSuggestion } from '@/components/custom/suggestion';
import { Suggestion } from '../supabase/types';

// Define proper types for the plugin state
interface SuggestionPluginState {
  decorations: DecorationSet;
  selected: string | null;
}

export interface UISuggestion extends Suggestion {
  selectionStart: number;
  selectionEnd: number;
}

interface Position {
  start: number;
  end: number;
}

function findPositionsInDoc(doc: Node, searchText: string): Position | null {
  if (!searchText) return null;

  let positions: Position | null = null;

  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    if (node.isText && node.text) {
      const index = node.text.indexOf(searchText);

      if (index !== -1) {
        positions = {
          start: pos + index,
          end: pos + index + searchText.length,
        };

        return false; // Stop searching once found
      }
    }

    return true;
  });

  return positions;
}

export function projectWithPositions(
  doc: Node,
  suggestions: Array<Suggestion>
): Array<UISuggestion> {
  return suggestions.map((suggestion) => {
    const positions = findPositionsInDoc(doc, suggestion.original_text);

    if (!positions) {
      return {
        ...suggestion,
        selectionStart: 0,
        selectionEnd: 0,
      };
    }

    return {
      ...suggestion,
      selectionStart: positions.start,
      selectionEnd: positions.end,
    };
  });
}

interface SuggestionWidgetSpec {
  dom: HTMLElement;
  destroy: () => void;
}

export function createSuggestionWidget(
  suggestion: UISuggestion,
  view: EditorView
): SuggestionWidgetSpec {
  const dom = document.createElement('span');
  const root = createRoot(dom);

  // Prevent editor from losing focus when clicking suggestion
  dom.addEventListener('mousedown', (event) => {
    event.preventDefault();
    view.dom.blur();
  });

  const onApply = () => {
    const { state, dispatch } = view;

    // Handle decorations
    let decorationTransaction = state.tr;
    const currentState = suggestionsPluginKey.getState(state) as SuggestionPluginState;
    
    if (currentState?.decorations) {
      const newDecorations = DecorationSet.create(
        state.doc,
        currentState.decorations.find().filter((decoration: Decoration) => {
          return (decoration.spec as any).suggestionId !== suggestion.id;
        })
      );

      decorationTransaction.setMeta(suggestionsPluginKey, {
        decorations: newDecorations,
        selected: null,
      });
      dispatch(decorationTransaction);
    }

    // Apply the suggestion text
    if (suggestion.selectionStart !== suggestion.selectionEnd) {
      const textTransaction = view.state.tr.replaceWith(
        suggestion.selectionStart,
        suggestion.selectionEnd,
        state.schema.text(suggestion.suggested_text)
      );

      // Mark as non-debounced change
      textTransaction.setMeta('no-debounce', true);
      dispatch(textTransaction);
    }
  };

  root.render(<PreviewSuggestion suggestion={suggestion} onApply={onApply} />);

  return {
    dom,
    destroy: () => {
      // Safely unmount the React component
      setTimeout(() => {
        root.unmount();
      }, 0);
    },
  };
}

export const suggestionsPluginKey = new PluginKey<SuggestionPluginState>('suggestions');

export const suggestionsPlugin = new Plugin<SuggestionPluginState>({
  key: suggestionsPluginKey,

  state: {
    init(): SuggestionPluginState {
      return { 
        decorations: DecorationSet.empty, 
        selected: null 
      };
    },

    apply(tr, pluginState: SuggestionPluginState, oldState: EditorState, newState: EditorState): SuggestionPluginState {
      // Check for plugin-specific metadata updates
      const meta = tr.getMeta(suggestionsPluginKey);
      if (meta) return meta;

      // Map decorations through document changes
      return {
        decorations: pluginState.decorations.map(tr.mapping, tr.doc),
        selected: pluginState.selected,
      };
    },
  },

  props: {
    decorations(state: EditorState): DecorationSet {
      const pluginState = this.getState(state);
      return pluginState?.decorations ?? DecorationSet.empty;
    },
  },
});
