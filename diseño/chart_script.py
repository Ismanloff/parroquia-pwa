import plotly.graph_objects as go
import plotly.express as px

# Updated data with correct Development layer
data = [
    {"Layer": "Foundation", "Technologies": "React Native 0.82, Expo SDK 54, TypeScript 5.6+, Node.js 20+", "Color": "#98D8E8", "Order": 1},
    {"Layer": "Navigation", "Technologies": "Expo Router v6, React Navigation 7.0", "Color": "#DDA0DD", "Order": 2},
    {"Layer": "State Mgmt", "Technologies": "Zustand v5, TanStack Query v5", "Color": "#FFEAA7", "Order": 3},
    {"Layer": "UI & Styling", "Technologies": "NativeWind v4, RN Reanimated v4", "Color": "#96CEB4", "Order": 4},
    {"Layer": "Forms & Valid", "Technologies": "React Hook Form v7.65, Zod", "Color": "#45B7D1", "Order": 5},
    {"Layer": "Development", "Technologies": "Metro, EAS Build, Flipper (deprecated)", "Color": "#4ECDC4", "Order": 6},
    {"Layer": "Testing", "Technologies": "Jest, Detox, RN Testing Lib", "Color": "#FF6B6B", "Order": 7}
]

# Create figure
fig = go.Figure()

# Add each layer as a stacked rectangle
layer_height = 1
y_positions = []

for i, item in enumerate(data):
    y_bottom = i * layer_height
    y_top = (i + 1) * layer_height
    y_positions.append((y_bottom + y_top) / 2)
    
    # Add the rectangle for each layer
    fig.add_trace(go.Scatter(
        x=[0, 4, 4, 0, 0],
        y=[y_bottom, y_bottom, y_top, y_top, y_bottom],
        fill='toself',
        fillcolor=item["Color"],
        line=dict(color='black', width=2),
        mode='lines',
        showlegend=False,
        hovertemplate=f"<b>{item['Layer']}</b><br>{item['Technologies']}<extra></extra>",
        name=item["Layer"]
    ))
    
    # Add layer title
    fig.add_annotation(
        x=0.2,
        y=(y_bottom + y_top) / 2,
        text=f"<b>{item['Layer']}</b>",
        showarrow=False,
        font=dict(size=14, color='black'),
        xanchor='left',
        yanchor='middle'
    )
    
    # Add technologies text
    fig.add_annotation(
        x=2.2,
        y=(y_bottom + y_top) / 2,
        text=item['Technologies'],
        showarrow=False,
        font=dict(size=11, color='black'),
        xanchor='left',
        yanchor='middle'
    )

# Update layout
fig.update_layout(
    title="React Native 2025 Tech Stack",
    xaxis=dict(
        visible=False,
        range=[-0.5, 4.5]
    ),
    yaxis=dict(
        visible=False,
        range=[-0.5, len(data) + 0.5]
    ),
    plot_bgcolor='rgba(0,0,0,0)',
    paper_bgcolor='rgba(0,0,0,0)',
    showlegend=False
)

# Save as PNG and SVG
fig.write_image("react_native_stack.png")
fig.write_image("react_native_stack.svg", format="svg")

print("Chart saved as react_native_stack.png and react_native_stack.svg")