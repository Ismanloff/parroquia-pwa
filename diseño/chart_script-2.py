import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime

# Create the data
data = [
    {"Version": "0.74", "Date": "Apr 2024", "Key Features": "Yoga 3.0, Bridgeless New Architecture", "Type": "Architecture"},
    {"Version": "0.75", "Date": "Aug 2024", "Key Features": "Percentage Values, iOS 15.1 minimum", "Type": "Platform Support"},
    {"Version": "0.76", "Date": "Oct 2024", "Key Features": "New Architecture by default", "Type": "Architecture"},
    {"Version": "0.77", "Date": "Jan 2025", "Key Features": "CSS Features, Android 16KB support", "Type": "Performance"},
    {"Version": "0.81", "Date": "Aug 2025", "Key Features": "Android 16 support, faster iOS builds", "Type": "Performance"},
    {"Version": "0.82", "Date": "Oct 2025", "Key Features": "First version fully New Architecture", "Type": "Architecture"}
]

df = pd.DataFrame(data)

# Convert dates to datetime for proper timeline
date_mapping = {
    "Apr 2024": datetime(2024, 4, 1),
    "Aug 2024": datetime(2024, 8, 1), 
    "Oct 2024": datetime(2024, 10, 1),
    "Jan 2025": datetime(2025, 1, 1),
    "Aug 2025": datetime(2025, 8, 1),
    "Oct 2025": datetime(2025, 10, 1)
}

df['DateTime'] = df['Date'].map(date_mapping)

# Create abbreviated feature descriptions (max 15 chars per line)
df['Short_Features'] = [
    "Yoga 3.0<br>Bridgeless",
    "% Values<br>iOS 15.1 min", 
    "New Arch<br>by default",
    "CSS Features<br>Android 16KB",
    "Android 16<br>Faster builds",
    "Full New<br>Architecture"
]

# Define colors for each type
color_mapping = {
    'Architecture': '#1FB8CD',
    'Performance': '#DB4545', 
    'Platform Support': '#2E8B57'
}

# Create the timeline chart
fig = go.Figure()

# Add traces for each feature type
for feature_type in df['Type'].unique():
    subset = df[df['Type'] == feature_type]
    
    fig.add_trace(go.Scatter(
        x=subset['DateTime'],
        y=[0] * len(subset),  # All on horizontal line at y=0
        mode='markers+text',
        marker=dict(
            size=25,
            color=color_mapping[feature_type],
            symbol='circle',
            line=dict(width=2, color='white')
        ),
        text=subset['Version'],
        textposition='top center',
        name=feature_type,
        hovertemplate='<b>React Native %{text}</b><br>' +
                     'Date: %{customdata[0]}<br>' +
                     'Features: %{customdata[1]}<br>' +
                     'Type: %{customdata[2]}<extra></extra>',
        customdata=subset[['Date', 'Key Features', 'Type']].values
    ))

# Add feature descriptions as separate text annotations
for _, row in df.iterrows():
    fig.add_trace(go.Scatter(
        x=[row['DateTime']],
        y=[-0.3],
        mode='text',
        text=[row['Short_Features']],
        textfont=dict(size=10, color='#666666'),
        showlegend=False,
        hoverinfo='skip'
    ))

# Update layout
fig.update_layout(
    title='React Native Roadmap 2024-2025',
    xaxis_title='Timeline',
    yaxis=dict(
        visible=False,
        range=[-0.6, 0.4]
    ),
    xaxis=dict(
        showgrid=True,
        gridcolor='lightgray',
        tickformat='%b %Y'
    ),
    legend=dict(
        orientation='h', 
        yanchor='bottom', 
        y=1.05, 
        xanchor='center', 
        x=0.5
    ),
    showlegend=True
)

# Update traces to clip on axis
fig.update_traces(cliponaxis=False)

# Save the chart
fig.write_image("react_native_timeline.png")
fig.write_image("react_native_timeline.svg", format="svg")

print("Updated timeline chart created successfully!")