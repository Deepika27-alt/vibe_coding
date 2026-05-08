import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  useReactFlow,
} from 'reactflow';
import { IconButton } from '@mui/material';
import { X } from 'lucide-react';

export default function DeleteEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <IconButton
            size="small"
            onClick={onEdgeClick}
            sx={{
              bgcolor: 'white',
              border: '1px solid #e2e8f0',
              width: 20,
              height: 20,
              '&:hover': {
                bgcolor: '#fee2e2',
                borderColor: '#f87171',
                color: '#ef4444',
              },
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              p: 0.25
            }}
          >
            <X size={12} />
          </IconButton>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
