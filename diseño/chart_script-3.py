import plotly.graph_objects as go
import pandas as pd

# Load the data
data = [
    {"Feature": "TypeScript Support", "React Navigation 7.0": "Excellent with Static API", "Expo Router v6": "Good", "Winner": "React Navigation"},
    {"Feature": "Deep Linking", "React Navigation 7.0": "Manual setup required", "Expo Router v6": "Automatic from file structure", "Winner": "Expo Router"},
    {"Feature": "Web Support", "React Navigation 7.0": "Limited", "Expo Router v6": "Excellent (Next.js-like)", "Winner": "Expo Router"},
    {"Feature": "File-based Routing", "React Navigation 7.0": "No", "Expo Router v6": "Yes", "Winner": "Expo Router"},
    {"Feature": "Static Typing", "React Navigation 7.0": "New Static API", "Expo Router v6": "Good", "Winner": "React Navigation"},
    {"Feature": "Learning Curve", "React Navigation 7.0": "Moderate", "Expo Router v6": "Easy (familiar to web devs)", "Winner": "Expo Router"},
    {"Feature": "Performance", "React Navigation 7.0": "Optimized", "Expo Router v6": "Good", "Winner": "React Navigation"},
    {"Feature": "Bundle Size", "React Navigation 7.0": "Larger", "Expo Router v6": "Smaller", "Winner": "Expo Router"},
    {"Feature": "Universal Links", "React Navigation 7.0": "Manual setup", "Expo Router v6": "Built-in", "Winner": "Expo Router"},
    {"Feature": "Community Support", "React Navigation 7.0": "Very Large", "Expo Router v6": "Growing", "Winner": "React Navigation"}
]

df = pd.DataFrame(data)

# Create color mapping for winners
react_nav_color = '#1FB8CD'  # Strong cyan for React Navigation
expo_router_color = '#DB4545'  # Bright red for Expo Router
neutral_color = '#f8f9fa'  # Light background

# Create cell colors based on winner
cell_colors = []
for _, row in df.iterrows():
    if row['Winner'] == 'React Navigation':
        # Highlight React Navigation column
        colors = [neutral_color, react_nav_color, neutral_color, react_nav_color]
    else:  # Expo Router wins
        # Highlight Expo Router column
        colors = [neutral_color, neutral_color, expo_router_color, expo_router_color]
    cell_colors.append(colors)

# Transpose cell colors for plotly table format
cell_colors_transposed = list(zip(*cell_colors))

# Create the table
fig = go.Figure(data=[go.Table(
    header=dict(
        values=['<b>Feature</b>', '<b>React Navigation 7.0</b>', '<b>Expo Router v6</b>', '<b>Winner</b>'],
        line_color='darkslategray',
        fill_color='#2E8B57',  # Sea green header
        font=dict(color='white', size=14),
        height=40
    ),
    cells=dict(
        values=[df['Feature'], df['React Navigation 7.0'], df['Expo Router v6'], df['Winner']],
        line_color='darkslategray',
        fill_color=cell_colors_transposed,
        font=dict(color='black', size=12),
        height=35,
        align='left'
    )
)])

fig.update_layout(
    title='React Navigation 7.0 vs Expo Router v6 Comparison'
)

# Save as both PNG and SVG
fig.write_image('comparison_table.png')
fig.write_image('comparison_table.svg', format='svg')